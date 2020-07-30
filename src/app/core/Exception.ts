class CustomError  extends Error{
	public msg:string // 需要提前声明值，默认为public
  public code:number
  public transaction:any
  
	public constructor(msg:string,code:number, transaction: any){
    super(msg)
		this.msg = msg
    this.code = code
    this.transaction = transaction
	}

}
module.exports = CustomError 
