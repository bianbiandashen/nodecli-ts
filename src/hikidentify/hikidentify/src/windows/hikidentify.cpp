#include<node_api.h>
#include<Windows.h>  
#include<iostream>  
#include<sstream>
#include<fstream>
#include<vector>
#include<memory.h>

using namespace std;

//������������ָ�룬������Ҫdll��������Щ�������Ͷ�д��Ӧ�ĺ���ָ�� ��ֵ����
typedef  int  (CALLBACK *pFUN)(unsigned char[], int, unsigned char[], int);
typedef  int  (CALLBACK *PFUNEncryptData)(const char* , int , char* , int& );
typedef  int  (CALLBACK *PFUNDecryptData)(const char* , int , char* , int& );
typedef  int  (CALLBACK *pFUNApply)(const char* , int , char* , int& );
typedef  int  (CALLBACK *pFUNApplyEx)(const char* , int , char* , int& );
typedef  int  (CALLBACK *PFUNIdentifyCheck)(const char* , int , const char* , int );
typedef  int  (CALLBACK *PFUNIdentifyCheckEx)(const char* , int , int , const char* , int );
typedef  int  (CALLBACK *pFUNinit)();
typedef  int  (CALLBACK *pFUNfini)();
//�����ӿ�ʱ�� step2 �����������֣�
const char* funName_ExportAKSK = "Identify_ExportAKSK";
const char* funName_EncryptData = "Identify_EncryptData";
const char* funName_DecryptData = "Identify_DecryptData";
const char* funName_Apply = "Identify_Apply";
const char* funName_ApplyEx = "Identify_ApplyEx";
const char* funName_Check = "Identify_Check";
const char* funName_CheckEx = "Identify_CheckEx";
const char* funName2 = "Identify_Init";
const char* funName3 = "Identify_Fini";

static char base64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static int pos(char c){
	char *p;
	for (p = base64; *p; p++)
		if (*p == c)
			return p - base64;
	return -1;
}

int base64_encode(const void *data, int size, char **str){
		char *s, *p;
		int i;
		int c;
		const unsigned char *q;

		s = (char*)malloc(size * 4 / 3 + 4);
		p = s;
		if (p == NULL)
			return -1;
		q = (const unsigned char*)data;
		i = 0;
		for (i = 0; i < size;) {
			c = q[i++];
			c *= 256;
			if (i < size)
				c += q[i];
			i++;
			c *= 256;
			if (i < size)
				c += q[i];
			i++;
			p[0] = base64[(c & 0x00fc0000) >> 18];
			p[1] = base64[(c & 0x0003f000) >> 12];
			p[2] = base64[(c & 0x00000fc0) >> 6];
			p[3] = base64[(c & 0x0000003f) >> 0];
			if (i > size)
				p[3] = '=';
			if (i > size + 1)
				p[2] = '=';
			p += 4;
		}
		*p = 0;
		*str = s;
		//if (s == NULL)
		//    return -1;
		return strlen(s);
}

int base64_decode(const char *str, void *data){
		const char *p;
		unsigned char *q;
		int c;
		int x;
		int done = 0;
		q = (unsigned char*)data;
		for (p = str; *p && !done; p += 4) {
			x = pos(p[0]);
			if (x >= 0)
				c = x;
			else {
				done = 3;
				break;
			}
			c *= 64;

			x = pos(p[1]);
			if (x >= 0)
				c += x;
			else
				return -1;
			c *= 64;

			if (p[2] == '=')
				done++;
			else {
				x = pos(p[2]);
				if (x >= 0)
					c += x;
				else
					return -1;
			}
			c *= 64;

			if (p[3] == '=')
				done++;
			else {
				if (done)
					return -1;
				x = pos(p[3]);
				if (x >= 0)
					c += x;
				else
					return -1;
			}
			if (done < 3)
				*q++ = (c & 0x00ff0000) >> 16;

			if (done < 2)
				*q++ = (c & 0x0000ff00) >> 8;
			if (done < 1)
				*q++ = (c & 0x000000ff) >> 0;
		}
		return q - (unsigned char*)data;
}

void SplitString(const std::string& s, std::vector<std::string>& v, const std::string& c){
	  std::string::size_type pos1, pos2;
	  pos2 = s.find(c);
	  pos1 = 0;
	  while(std::string::npos != pos2)
	  {
		v.push_back(s.substr(pos1, pos2-pos1));
	 
		pos1 = pos2 + c.size();
		pos2 = s.find(c, pos1);
	  }
	  if(pos1 != s.length())
		v.push_back(s.substr(pos1));
}

std::string UTF8ToGB(const char* str){
      std::string result;
      WCHAR *strSrc;
      TCHAR *szRes;

      //�����ʱ�����Ĵ�С
     int i = MultiByteToWideChar(CP_UTF8, 0, str, -1, NULL, 0);
      strSrc = new WCHAR[i+1];
      MultiByteToWideChar(CP_UTF8, 0, str, -1, strSrc, i);

      //�����ʱ�����Ĵ�С
     i = WideCharToMultiByte(CP_ACP, 0, strSrc, -1, NULL, 0, NULL, NULL);
      szRes = new TCHAR[i+1];
      WideCharToMultiByte(CP_ACP, 0, strSrc, -1, szRes, i, NULL, NULL);

      result = szRes;
      delete []strSrc;
      delete []szRes;

      return result;
 }

std::string genSK(std::string dllPath){
	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());
	fstream fs("log.txt",ios::out|ios::trunc);
	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return "";
	}

	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	pFUN fp1 = (pFUN)GetProcAddress(hDLL, funName_ExportAKSK);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL)
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���" << endl;
		return "";
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��" << endl;
		return "";
	}

	int akLen = 64;
	unsigned char szAK[64] = { 0 };
	int skLen = 64;
	unsigned char szSK[64] = { 0 };
	//���ú���ָ�룬��ע��������ȡ��aksk����������ֻҪ��Ҫ����sk�Ϳ�����
	int len = fp1(szAK, akLen, szSK, skLen);
	if (len != 0) {
		fs << "����Identify_ExportAKSK��û����ȷ����,����ȡ������ȷ��sk" << endl;
		return "";
	}

	//�ҵ�sk�� ��sk��32λ Ϊ������33 ���һλ����0
	unsigned char sK[33] = { 0 };
	for (int i = 0; i < 32; ++i) {
		sK[i] = szSK[i];
	}
	fs << "sk is :" << sK << endl;

	//�ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	return (char*)sK;
}

std::string encryptStr(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());
	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return "";
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	PFUNEncryptData fp1 = (PFUNEncryptData)GetProcAddress(hDLL, funName_EncryptData);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return "";
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return "";
	}
	//���Ŀ�ʼ
	char EncryptData[1024 * 10] = { 0 };
	int EncryptDataLen = 1024 * 10;
	if (fp1(data.c_str(), data.size(), EncryptData, EncryptDataLen) != 0)
	{
		fs << "����Identify_EncryptData��û����ȷ����,����ȡ������ȷ��zhi." << endl;
		return "";
	}
	char* base64EncodeBuffer = NULL;
	int iRet = base64_encode(EncryptData, EncryptDataLen, &base64EncodeBuffer);
	if (iRet < 0)
	{
		fs << "����base64_encode��,û�м��ܳɹ�." << endl;
		return "";
	}
	
	fs << "after EncryptData is: " << base64EncodeBuffer << endl;

	
	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	string result = base64EncodeBuffer;
	free(base64EncodeBuffer);
	return result;
}

std::string encryptMultiStr(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());
	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return "";
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	PFUNEncryptData fp1 = (PFUNEncryptData)GetProcAddress(hDLL, funName_EncryptData);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return "";
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return "";
	}
	vector<string> vtData;
	stringstream ssResult;
	//��,�ָ���error������
	SplitString(data,vtData,",");
	for(int i=0;i<vtData.size();i++)
	{
		//���Ŀ�ʼ
		char EncryptData[1024 * 10] = { 0 };
		int EncryptDataLen = 1024 * 10;
		if (fp1(vtData[i].c_str(), vtData[i].size(), EncryptData, EncryptDataLen) != 0)
		{
			fs <<"��"<<i<<"�ε���Identify_EncryptData��û����ȷ����,����ȡ������ȷ��zhi." << endl;
			ssResult<<"error,";
			continue;
		}
		char* base64EncodeBuffer = NULL;
		int iRet = base64_encode(EncryptData, EncryptDataLen, &base64EncodeBuffer);
		if (iRet < 0)
		{
			fs <<"��"<<i<<"�ε���base64_encode��,û�м��ܳɹ�." << endl;
			ssResult<<"error,";
			continue;
		}
		
		string tmp = base64EncodeBuffer;
		free(base64EncodeBuffer);
		ssResult<<tmp<<",";
		fs <<"��"<<i<<"��after EncryptData is: " << tmp.c_str() << endl;
	}
	string result=ssResult.str();
	if(result!="")
		result = result.substr(0, result.length() - 1); //�������һλ����
	
	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	return result;
}


std::string decryptStr(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());
	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return "";
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	PFUNDecryptData fp1 = (PFUNDecryptData)GetProcAddress(hDLL, funName_DecryptData);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return "";
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return "";
	}
	//���Ŀ�ʼ
	char base64DecodeBuffer[1000] = { 0 };
	int iRet = base64_decode(data.c_str(), base64DecodeBuffer);
	if (iRet < 0)
	{
		fs << "����base64_encode��,û�н��ܳɹ�." << endl;
		return "";
	}


	char DecryptData[1024 * 10] = { 0 };
	int DecryptDataLen = 1024 * 10;
	if (fp1(base64DecodeBuffer, iRet, DecryptData, DecryptDataLen) != 0)
	{
		fs << "����Identify_DecryptData��û����ȷ����,����ȡ������ȷ��zhi." << endl;
		return "";
	}

	string result(DecryptData, DecryptDataLen);
	
	fs << "after DecryptData is: " << result.c_str() << endl;


	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	return result;
}

std::string decryptMultiStr(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	fs<<"data:"<<data<<endl;
	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());
	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return "";
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	PFUNDecryptData fp1 = (PFUNDecryptData)GetProcAddress(hDLL, funName_DecryptData);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return "";
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return "";
	}
	vector<string> vtData;
	stringstream ssResult;
	//��,�ָ���error������
	SplitString(data,vtData,",");
	for(int i=0;i<vtData.size();i++)
	{
		//���Ŀ�ʼ
		char base64DecodeBuffer[1000] = { 0 };
		int iRet = base64_decode(vtData[i].c_str(), base64DecodeBuffer);
		if (iRet < 0)
		{
			fs <<"��"<<i<<"�ε���base64_decode��,û�н��ܳɹ�."<< endl;
			ssResult<<"error,";
			continue;
		}


		char DecryptData[1024 * 10] = { 0 };
		int DecryptDataLen = 1024 * 10;
		if (fp1(base64DecodeBuffer, iRet, DecryptData, DecryptDataLen) != 0)
		{
			fs <<"��"<<i<<"�ε���Identify_DecryptData��û����ȷ����,����ȡ������ȷ��zhi." << endl;
			ssResult<<"error,";
			continue;
		}

		string tmp(DecryptData, DecryptDataLen);
		ssResult<<tmp<<",";
		fs <<"��"<<i<<"��after DecryptData is: " << tmp.c_str() << endl;
	}
	
	string result=ssResult.str();
	if(result!="")
		result = result.substr(0, result.length() - 1); //�������һλ����

	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	return result;
}

std::string genToken(std::string dllPath){
	fstream fs("log.txt", ios::out | ios::trunc);
	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());
	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return "";
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	pFUNApply fp1 = (pFUNApply)GetProcAddress(hDLL, funName_Apply);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return "";
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return "";
	}
	//���Ŀ�ʼ
	char szIdentifyData[1024 * 10] = { 0 };
	int nIdentifyDataLen = 1024 * 10;
	if (fp1(NULL, 0, szIdentifyData, nIdentifyDataLen) != 0)
	{
		fs << "����Identify_Apply��û����ȷ����,����ȡ������ȷ��token." << endl;
		return "";
	}
	int iIdentifyencodeDataLen = 1024 * 10;
	char* base64EncodeBuffer = NULL;
	int iRet = base64_encode(szIdentifyData, nIdentifyDataLen, &base64EncodeBuffer);
	if (iRet < 0)
	{
		fs << "����base64_encode��,û�м��ܳɹ�." << endl;
		return "";
	}
	fs << "token is: " << base64EncodeBuffer << endl;


	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	string result = base64EncodeBuffer;
	free(base64EncodeBuffer);
	return result;
}

std::string genTokenEx(std::string dllPath){
	fstream fs("log.txt", ios::out | ios::trunc);
	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());
	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return "";
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	pFUNApplyEx fp1 = (pFUNApplyEx)GetProcAddress(hDLL, funName_ApplyEx);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return "";
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return "";
	}
	//���Ŀ�ʼ
	char szIdentifyData[1024 * 10] = { 0 };
	int nIdentifyDataLen = 1024 * 10;
	if (fp1(NULL, 0, szIdentifyData, nIdentifyDataLen) != 0)
	{
		fs << "����Identify_ApplyEx��û����ȷ����,����ȡ������ȷ��token." << endl;
		return "";
	}
	int iIdentifyencodeDataLen = 1024 * 10;
	char* base64EncodeBuffer = NULL;
	int iRet = base64_encode(szIdentifyData, nIdentifyDataLen, &base64EncodeBuffer);
	if (iRet < 0)
	{
		fs << "����base64_encode��,û�м��ܳɹ�." << endl;
		return "";
	}
	fs << "tokenEx is: " << base64EncodeBuffer << endl;


	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	string result = base64EncodeBuffer;
	free(base64EncodeBuffer);
	return result;
}

int check(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);

	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());

	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return -1;
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	PFUNIdentifyCheck fp1 = (PFUNIdentifyCheck)GetProcAddress(hDLL, funName_Check);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return -1;
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return -1;
	}
	//���Ŀ�ʼ

	char output[200] = { 0 };

	int nRet = base64_decode(data.c_str(), output);
	if (nRet <= 0)
	{
		fs << "����base64_decode����ʧ��." << endl;
		fp3();
		FreeLibrary(hDLL);
		return -1;
	}

	int iRet = fp1(NULL, 0, output, nRet);
	if (iRet != 0)
	{
		fs << "����Identify_Check��û����ȷ����,����ȡ������ȷ��zhi." << endl;
		fp3();
		FreeLibrary(hDLL);
		return iRet;
	}


	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	return 0;
}

int checkEx(std::string dllPath,std::string data,int expireTime){
	fstream fs("log.txt", ios::out | ios::trunc);

	//1�ҵ����dll
	stringstream ss;
	ss<<UTF8ToGB(dllPath.c_str())<<"\\lib\\windows\\Identify.dll";
	HMODULE hDLL = LoadLibraryA(ss.str().c_str());

	if (hDLL == NULL)
	{
		fs << "û���ҵ����dll" << endl;
		return -1;
	}

	//�����ӿ�ʱ�� step3 �õ���Ӧ�ĺ���ָ�룬����ȥ�Ϳ��Խ��е�����
	//2�ҵ�dll�����Ӧ�ĺ���ָ��
	PFUNIdentifyCheckEx fp1 = (PFUNIdentifyCheckEx)GetProcAddress(hDLL, funName_CheckEx);
	pFUNinit fp2 = (pFUNinit)GetProcAddress(hDLL, funName2);
	pFUNfini fp3 = (pFUNfini)GetProcAddress(hDLL, funName3);
	if (fp1 == NULL || fp2 == NULL || fp3 == NULL )
	{
		fs << "û�������dll�����ҵ���Ӧ�ĺ���." << endl;
		return -1;
	}
	int ret = fp2();
	if (ret != 0)
	{
		fs << "Identify_Init ��ʼ��ʧ��." << endl;
		return -1;
	}
	//���Ŀ�ʼ

	char output[200] = { 0 };

	int nRet = base64_decode(data.c_str(), output);
	if (nRet <= 0)
	{
		fs << "����base64_decode����ʧ��." << endl;
		fp3();
		FreeLibrary(hDLL);
		return -1;
	}

	int iRet = fp1(NULL, 0, expireTime, output, nRet);
	if (iRet != 0)
	{
		fs << "����Identify_CheckEx��û����ȷ����,����ȡ������ȷ��zhi." << endl;
		fp3();
		FreeLibrary(hDLL);
		return iRet;
	}


	//���Ľ������ƺ��ͷŹ���
	fp3();
	FreeLibrary(hDLL);
	return 0;
}

namespace identify {

	napi_value ExportSK (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[1]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = genSK(std::string(dllPath));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value EncryptData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = encryptStr(std::string(dllPath),std::string(data));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value EncryptMultiData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  //char data[100000] = "";
		  char* data=new char[1000000];
		  memset(data,0,1000000);
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, 1000000, &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = encryptMultiStr(std::string(dllPath),std::string(data)); 
		  delete [] data;
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value DecryptData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = decryptStr(std::string(dllPath),std::string(data));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value DecryptMultiData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  //char data[100000] = "";
		  char* data=new char[1000000];
		  memset(data,0,1000000);
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, 1000000, &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = decryptMultiStr(std::string(dllPath),std::string(data));
		  delete [] data;
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value GeneralToken (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[1]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = genToken(std::string(dllPath));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value GeneralTokenEx (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[1]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = genTokenEx(std::string(dllPath));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value IdentifyCheck (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  int rst = check(std::string(dllPath),std::string(data));
		  status = napi_create_int32(env, rst, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value IdentifyCheckEx (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[3]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  int32_t expireTime = 60;
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_int32(env, argv[2], &expireTime)){
			  return nullptr;
		  }
		  int rst = checkEx(std::string(dllPath),std::string(data),expireTime);
		  status = napi_create_int32(env, rst, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value init(napi_env env, napi_value exports) {
		napi_property_descriptor properties[] = {
			{ "exportSK", 0, ExportSK, 0, 0, 0, napi_default, 0 },
			{ "encryptData", 0, EncryptData, 0, 0, 0, napi_default, 0 },    
			{ "encryptMultiData", 0, EncryptMultiData, 0, 0, 0, napi_default, 0 },  
			{ "decryptData", 0, DecryptData, 0, 0, 0, napi_default, 0 },
			{ "decryptMultiData", 0, DecryptMultiData, 0, 0, 0, napi_default, 0 },
			{ "apply", 0, GeneralToken, 0, 0, 0, napi_default, 0 },
			{ "applyEx", 0, GeneralTokenEx, 0, 0, 0, napi_default, 0 },
			{ "check", 0, IdentifyCheck, 0, 0, 0, napi_default, 0 },
			{ "checkEx", 0, IdentifyCheckEx, 0, 0, 0, napi_default, 0 }
		};
		napi_status status = napi_define_properties(env, exports, sizeof(properties)/sizeof(properties[0]), properties);
		if( napi_ok != status){
			napi_throw_error(env, "INITIALIZE_FAILED", "Failed to initialize");
			return nullptr;
		}
		return exports;
	}

	NAPI_MODULE(hikidentify, init); 
} 